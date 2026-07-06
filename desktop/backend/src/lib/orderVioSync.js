const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getCrutUrl() {
  const origin = process.env.VIO_ORIGIN;
  const wsPath = process.env.VIO_WS_PATH;
  const api = process.env.VIO_API;

  const session = {
    loginTipi: 'login',
    user: process.env.VIO_USER,
    pass: process.env.VIO_PASS || ''
  };

  const sessionBase64 = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${origin}/${wsPath}/${api}/?session=${sessionBase64}`;
}

async function fetchOrdersFromVio(daysBack = null) {
  try {
    const url = getCrutUrl();
    
    // Kriter belirleme: Son X gün veya hepsi
    let fisKriter = "";
    if (daysBack) {
      // Örn: Son 1 günlük filtre
      // SQL dialectine göre değişebilir, genellikle "tarih >= DATEADD(day, -1, GETDATE())" kullanılır
      fisKriter = `tarih >= DATEADD(day, -${daysBack}, GETDATE())`;
    }

    const payload = {
      trn: false,
      queries: [
        { tip: 'select', table: 'sipfis', kriter: fisKriter },
        { tip: 'select', table: 'sipstok' } 
        // Not: sipstok çok büyükse "fissayac IN (SELECT kaysayac FROM sipfis WHERE ...)" yapılabilir.
        // Şimdilik tüm sipstokları veya ilgili olanları çekeceğiz.
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Vio API Error: ${response.statusText}`);
    }

    const responseText = await response.text();
    let data;
    try {
      data = (responseText && responseText.trim()) ? JSON.parse(responseText.trim()) : {};
    } catch (e) {
      throw new Error('Geçersiz JSON yanıtı alındı');
    }

    // data array of array of rows
    let sipfisRows = [];
    let sipstokRows = [];

    if (Array.isArray(data) && data.length >= 2) {
      sipfisRows = Array.isArray(data[0]) ? data[0] : (data[0].rows || []);
      sipstokRows = Array.isArray(data[1]) ? data[1] : (data[1].rows || []);
    }

    return { sipfisRows, sipstokRows };
  } catch (error) {
    console.error('Error fetching orders from Vio:', error);
    return { sipfisRows: [], sipstokRows: [] };
  }
}

/**
 * sipfis satırını Prisma Order yapısına çevirir
 */
function mapVioSipfisToErpOrder(row) {
  let orderCode = (row.fisnox || '').trim();
  if (!orderCode) {
    const seri = (row.seri || '').trim();
    const no = (row.no || '').trim();
    orderCode = `${seri}-${no}`;
  }

  // Tarih parse
  let orderDate = null;
  if (row.tarih) {
    orderDate = new Date(row.tarih);
    if (isNaN(orderDate.getTime())) orderDate = null;
  }

  let status = 'Completed';
  if (row.silindi === 'E') {
    status = 'Cancelled';
  }

  return {
    code: orderCode,
    status: status,
    vat: parseFloat(row.topkdv) || 0,
    totalAmount: parseFloat(row.net) || 0,
    notes: (row.cariaciklama || '').trim(),
    orderDate: orderDate || new Date(),
    _customerId: (row.must || '').trim(), // İlişki için geçici tutuyoruz
    _kaysayac: row.kaysayac // Sipstok eşleşmesi için
  };
}

/**
 * sipstok satırını Prisma OrderItem yapısına çevirir
 */
function mapVioSipstokToErpItem(row) {
  return {
    productName: '', // Ürün ismini bulduğumuzda ezeceğiz
    quantity: parseFloat(row.miktar) || 0,
    unitPrice: parseFloat(row.fiyat) || 0,
    currency: (row.dvkod || 'TRY').trim(),
    vat: parseFloat(row.satirkdvdagitim || row.tumkdv) || 0,
    _fissayac: row.fissayac, // Hangi siparişe ait
    _stokkod: (row.stokkod || '').trim()
  };
}

async function pullOrdersFromVio(daysBack = null) {
  console.log('\n--- Vio\'dan Siparişler Çekiliyor ---');
  const { sipfisRows, sipstokRows } = await fetchOrdersFromVio(daysBack);
  console.log(`Vio'dan toplam ${sipfisRows.length} Sipariş Ana Fişi (sipfis) geldi.`);
  console.log(`Vio'dan toplam ${sipstokRows.length} Sipariş Satırı (sipstok) geldi.`);

  if (sipfisRows.length === 0) {
    console.log('--- Sipariş Senkronizasyonu Tamamlandı (Sıfır Fiş) ---\n');
    return;
  }

  // Tüm DB Müşterilerini belleğe al (Performans için)
  const customers = await prisma.customer.findMany({ select: { id: true, code: true } });
  const customerMap = {};
  for (const c of customers) {
    customerMap[c.code] = c.id;
  }

  // Tüm DB Ürünlerini belleğe al
  const products = await prisma.product.findMany({ select: { id: true, code: true, name: true } });
  const productMap = {};
  for (const p of products) {
    productMap[p.code] = { id: p.id, name: p.name };
  }

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const fis of sipfisRows) {
    const mappedOrder = mapVioSipfisToErpOrder(fis);
    if (!mappedOrder.code || mappedOrder.code === '-') continue;

    // Müşteri kontrolü (Yoksa siparişi es geç)
    const customerId = customerMap[mappedOrder._customerId];
    if (!customerId) {
      skippedCount++;
      continue;
    }

    // Bu fişe ait satırları bul
    const lines = sipstokRows.filter(s => s.fissayac === mappedOrder._kaysayac);
    
    // Satırların ürünleri veritabanımızda mevcut mu?
    let allProductsExist = true;
    const orderItemsData = [];
    for (const line of lines) {
      const mappedItem = mapVioSipstokToErpItem(line);
      const productInfo = productMap[mappedItem._stokkod];
      
      if (!productInfo) {
        allProductsExist = false;
        break;
      }
      
      orderItemsData.push({
        productName: productInfo.name,
        quantity: mappedItem.quantity,
        unitPrice: mappedItem.unitPrice,
        currency: mappedItem.currency,
        vat: mappedItem.vat,
        productId: productInfo.id
      });
    }

    // Ürün eksikse siparişi es geç
    if (!allProductsExist) {
      skippedCount++;
      continue;
    }

    // Prisma Kayıt/Güncelleme
    const existingOrder = await prisma.order.findUnique({
      where: { code: mappedOrder.code }
    });

    const orderPayload = {
      code: mappedOrder.code,
      status: mappedOrder.status,
      vat: mappedOrder.vat,
      totalAmount: mappedOrder.totalAmount,
      notes: mappedOrder.notes,
      orderDate: mappedOrder.orderDate,
      customerId: customerId
    };

    if (!existingOrder) {
      // YENİ SİPARİŞ CREATE
      await prisma.order.create({
        data: {
          ...orderPayload,
          items: {
            create: orderItemsData
          }
        }
      });
      createdCount++;
    } else {
      // VAR OLAN SİPARİŞ GÜNCELLE
      // En güvenli yöntem: Sipariş ana bilgilerini güncelle, satırları silip yeni gelenleri baştan ekle
      await prisma.$transaction([
        // Ana sipariş güncelle
        prisma.order.update({
          where: { code: mappedOrder.code },
          data: orderPayload
        }),
        // Eski satırları sil
        prisma.orderItem.deleteMany({
          where: { orderId: existingOrder.id }
        }),
        // Yeni satırları oluştur
        prisma.order.update({
          where: { code: mappedOrder.code },
          data: {
            items: {
              create: orderItemsData
            }
          }
        })
      ]);
      updatedCount++;
    }
  }

  console.log(`[VIO SYNC] Başarıyla oluşturulan Yeni Siparişler: ${createdCount}`);
  console.log(`[VIO SYNC] Başarıyla Güncellenen Siparişler: ${updatedCount}`);
  console.log(`[VIO SYNC] Müşteri/Ürün eksikliği sebebiyle Es Geçilenler: ${skippedCount}`);
  console.log('--- Sipariş Senkronizasyonu Tamamlandı ---\n');
}

module.exports = {
  fetchOrdersFromVio,
  pullOrdersFromVio,
  mapVioSipfisToErpOrder,
  mapVioSipstokToErpItem
};
