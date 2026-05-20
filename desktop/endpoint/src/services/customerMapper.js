// Map a customer record from the external ERP to AKS Customer fields.
// Edit the keys on the RIGHT side to match the exact field names the other ERP returns.
function mapErpCustomer(erp) {
  const name =
    erp.companyName   ||
    erp.company_name  ||
    erp.name          ||
    erp.title         ||
    erp.CustomerName  ||
    'Unknown'

  return {
    // ── Identity ─────────────────────────────────────────────────────────────
    name,
    taxId:           erp.taxId         || erp.tax_id         || erp.vergiNo     || erp.VKN         || null,
    taxOffice:       erp.taxOffice     || erp.tax_office      || erp.vergiDairesi || null,
    ticaretSicil:    erp.ticaretSicil  || erp.trade_registry  || erp.ticariSicil  || null,
    mersisNo:        erp.mersisNo      || erp.mersis_no       || erp.MERSIS       || null,
    bolge:           erp.bolge         || erp.region          || erp.Region       || null,
    cariTip:         erp.cariTip       || erp.account_type    || null,
    istatistikGrup:  erp.istatistikGrup || erp.stat_group     || null,
    mukellefTipi:    erp.mukellefTipi  || erp.taxpayer_type   || 'Vergi Mükellefi',

    // ── Address ───────────────────────────────────────────────────────────────
    address:         erp.address       || erp.Address         || erp.adres        || null,
    city:            erp.city          || erp.City            || erp.sehir        || null,
    district:        erp.district      || erp.District        || erp.ilce         || null,
    postalCode:      erp.postalCode    || erp.postal_code     || erp.PostalCode   || null,
    country:         erp.country       || erp.Country         || erp.ulke         || null,
    phone:           erp.phone         || erp.Phone           || erp.telefon      || null,
    email:           erp.email         || erp.Email           || erp.eposta       || null,

    // ── Contact person ────────────────────────────────────────────────────────
    contactName:     erp.contactName   || erp.contact_name    || erp.ContactName  || null,
    contactPhone:    erp.contactPhone  || erp.contact_phone   || null,
    contactEmail:    erp.contactEmail  || erp.contact_email   || null,

    // ── External reference ────────────────────────────────────────────────────
    // Stored so you can match records back to the source ERP later
    erpId:           String(erp.id || erp.Id || erp.customerId || erp.CustomerID || ''),
  }
}

module.exports = { mapErpCustomer }
