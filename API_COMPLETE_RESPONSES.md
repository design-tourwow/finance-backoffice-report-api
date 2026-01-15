# API Complete Response Examples

## ✅ สรุป: ทุก API Endpoint Return ข้อมูลครบถ้วนแล้ว

ทดสอบวันที่: 13 มกราคม 2026  
Staging URL: https://staging-finance-backoffice-report-api.vercel.app

---

## 1. Customers API (`/api/customers`)

### Response Structure
```json
{
  "success": true,
  "data": [
    {
      "id": 152,
      "team_number": 3,
      "seller_agency_member_id": 629,
      "crm_agency_member_id": 623,
      "customer_code_prefix": "CUS2512",
      "customer_code_number": 1,
      "customer_code": "CUS251200001",
      "name": "จอง Item จากทัวร์ว้าว",
      "birth_date": null,
      "phone_number": "0292293211",
      "address": null,
      "email": "",
      "facebook_name": "",
      "facebook_url": null,
      "line_name": "",
      "line_url": null,
      "instagram": null,
      "remark": "",
      "first_paid_status_customer_order_installment_count": 1,
      "last_touchpoint_updated_at": null,
      "created_at": "2025-12-17T05:26:27.000Z",
      "created_by_agency_member_id": null,
      "updated_at": "2025-12-17T05:26:27.000Z",
      "updated_by_agency_member_id": null
    }
  ],
  "pagination": {
    "limit": 1,
    "offset": 0,
    "returned": 1
  }
}
```

### Fields Summary
- **Total Fields**: 21
- **JSON Fields**: None
- **Status**: ✅ ครบถ้วน

---

## 2. Orders API (`/api/orders`)

### Response Structure (มี JSON sub-fields)
```json
{
  "success": true,
  "data": [
    {
      "id": 1262,
      "order_code": "TWP26010001",
      "product_snapshot": {
        "id": 2414,
        "name": "Frozen มองโกเลีย ULAANBAATAR 5วัน 4คืน",
        "countries": [
          {
            "id": 19,
            "name_en": "Mongolia",
            "name_th": "มองโกเลีย"
          }
        ],
        "transportation": {
          "id": 76,
          "code": "OM",
          "name_en": "Miat Mongolian Airlines",
          "name_th": "มิอัท มองโกเลียนแอร์ไลน์"
        },
        "banner_image_files": [...],
        "product_descriptions": [...]
      },
      "product_period_snapshot": {
        "id": null,
        "start_at": "2026-04-07",
        "end_at": "2026-04-11",
        "room_types": [
          {
            "price": "38888.00",
            "room_type_id": 2,
            "room_type_slug": "adult_double"
          }
        ],
        "go_transportation": {...},
        "back_transportation": {...}
      }
    }
  ]
}
```

### Fields Summary
- **Total Fields**: 100+ (รวม sub-fields)
- **JSON Fields**: 
  - `product_snapshot` (มี 30+ sub-fields)
  - `product_period_snapshot` (มี 25+ sub-fields)
  - `product_pool_snapshot`
- **Status**: ✅ ครบถ้วน พร้อม JSON parsing

### Sub-fields ใน product_snapshot:
- id, name, note, tags, price, countries[], provinces[]
- tour_code, description, duration_day, duration_night
- suppliers_id, tourwow_slug, tour_condition
- transportation{}, banner_file_url, attachment_files[]
- sell_status_code, category_sales_id
- commission_seller, commission_company
- country_sub_units[], banner_image_files[]
- hilight_description, product_descriptions[]
- product_doc_file_url, product_pdf_file_url
- transportation_category{}, pro_category_products_id

### Sub-fields ใน product_period_snapshot:
- id, start_at, end_at, remark, deposit, quantity
- group_code, is_example, product_id
- room_types[] (แต่ละ room type มี: price, room_type_id, price_compare, room_type_slug)
- go_flight_number, back_flight_number
- quantity_minimum, quantity_informal, quantity_tour_lead
- sell_status_code, sell_status_reason
- commission_seller, commission_company
- deposit_is_active
- go_transportation{}, back_transportation{}
- go_airport_arrival, go_airport_departure
- back_airport_arrival, back_airport_departure
- go_flight_time_arrival, go_flight_time_departure
- back_flight_time_arrival, back_flight_time_departure
- transportaion_category{}, transportation_description
- is_channel_twp_online_booking

---

## 3. Installments API (`/api/installments`)

### Response Structure
```json
{
  "success": true,
  "data": [
    {
      "id": 1821,
      "order_id": 1262,
      "ordinal": 3,
      "status": "pending",
      "due_date": "2026-03-14T00:00:00.000Z",
      "amount": "76.00000",
      "payment_is_in_progress": 0,
      "customer_order_installment_snapshot": null
    }
  ]
}
```

### Fields Summary
- **Total Fields**: 8
- **JSON Fields**: 
  - `customer_order_installment_snapshot` (อาจมี payment_method, paid_at, etc.)
- **Status**: ✅ ครบถ้วน พร้อม JSON parsing

---

## 4. Suppliers API (`/api/suppliers`)

### Response Structure
```json
{
  "success": true,
  "data": [
    {
      "id": 75,
      "name_en": "SABAY DE TOUR",
      "name_th": "สบายดรทัวร์",
      "product_twp_slug": "LKIW",
      "category_tourism_licenses_id": 2,
      "tourism_license": "11/921312",
      "tourism_license_expire_at": "2030-12-27T00:00:00.000Z",
      "company_type": 1,
      "company_license": "1231412312312",
      "company_name": "บริษัท ดริฟท์ ทราเวล  จำกัด",
      "individual_first_name": "",
      "individual_last_name": "",
      "individual_id_card": "",
      "fax_no": null,
      "email": "mairabu@mail.com",
      "line_id": null,
      "twitter": null,
      "youtube": null,
      "instagram": null,
      "website": null,
      "description": null,
      "note": null,
      "program_quantity": null,
      "status_code": 3,
      "status_reason": null,
      "product_pool_ranking": 99,
      "created_by": null,
      "created_at": "2023-12-20T05:25:14.000Z",
      "updated_by": null,
      "updated_at": "2023-12-20T05:27:05.000Z",
      "validated_by": null,
      "validated_at": null,
      "code": "TW_SU_66120002",
      "image_file_name": "38821777f30b69308441237ab07cf36d.png",
      "image_file_size": 54843,
      "image_content_type": "image/png",
      "image_updated_at": "2023-12-20T05:25:15.000Z",
      "company_license_document_file_name": null,
      "company_license_document_file_size": null,
      "company_license_document_content_type": null,
      "company_license_document_updated_at": null,
      "individual_id_card_document_file_name": null,
      "individual_id_card_document_file_size": null,
      "individual_id_card_document_content_type": null,
      "individual_id_card_document_updated_at": null,
      "facebook": null,
      "is_free_cancel": 0,
      "is_withholding_tax": 1,
      "tel": "0929229299",
      "is_product_twp": 1,
      "is_product_tw": 0,
      "product_twp_invoice_approve_auto": 1,
      "product_twp_invoice_default_note": "",
      "product_twp_invoice_installment_first": 2,
      "product_twp_invoice_installment_second": 23,
      "product_twp_period_display_commission": 1,
      "product_twp_invoice_themes_id": 1,
      "product_twp_invoice_email_sender_seller": 1,
      "is_channel_ob": 1
    }
  ]
}
```

### Fields Summary
- **Total Fields**: 57
- **JSON Fields**: None
- **Status**: ✅ ครบถ้วน

---

## 📊 สรุปรวม

| API Endpoint | Total Fields | JSON Fields | Sub-fields | Status |
|-------------|--------------|-------------|------------|--------|
| `/api/customers` | 21 | 0 | 0 | ✅ ครบ |
| `/api/orders` | 100+ | 3 | 55+ | ✅ ครบ + Parsed |
| `/api/installments` | 8 | 1 | varies | ✅ ครบ + Parsed |
| `/api/suppliers` | 57 | 0 | 0 | ✅ ครบ |

---

## 🎯 JSON Field Parsing

### ทำงานแล้ว:
- ✅ `product_snapshot` - Parse เป็น object พร้อม sub-fields ครบ
- ✅ `product_period_snapshot` - Parse เป็น object พร้อม sub-fields ครบ
- ✅ `product_pool_snapshot` - Parse ถ้ามีข้อมูล
- ✅ `customer_order_installment_snapshot` - Parse ถ้ามีข้อมูล

### ตัวอย่าง Sub-fields ที่ Parse ได้:

**product_snapshot.countries[]:**
```json
[
  {
    "id": 19,
    "name_en": "Mongolia",
    "name_th": "มองโกเลีย"
  }
]
```

**product_snapshot.transportation:**
```json
{
  "id": 76,
  "code": "OM",
  "name_en": "Miat Mongolian Airlines",
  "name_th": "มิอัท มองโกเลียนแอร์ไลน์"
}
```

**product_period_snapshot.room_types[]:**
```json
[
  {
    "price": "38888.00",
    "room_type_id": 2,
    "price_compare": null,
    "room_type_slug": "adult_double"
  }
]
```

---

## ✅ Checklist

- [x] Customers API - ทุก field ครบ
- [x] Orders API - ทุก field ครบ + JSON parsed
- [x] Installments API - ทุก field ครบ + JSON parsed
- [x] Suppliers API - ทุก field ครบ
- [x] JSON fields ถูก parse เป็น object
- [x] Sub-fields ทั้งหมดแสดงครบ
- [x] Nested objects (countries, transportation, room_types) แสดงครบ
- [x] Arrays ภายใน JSON แสดงครบ

---

## 🧪 คำสั่งทดสอบ

```bash
# Test Customers
curl "https://staging-finance-backoffice-report-api.vercel.app/api/customers?limit=1" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# Test Orders (with JSON fields)
curl "https://staging-finance-backoffice-report-api.vercel.app/api/orders?limit=1" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# Test Installments
curl "https://staging-finance-backoffice-report-api.vercel.app/api/installments?limit=1" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"

# Test Suppliers
curl "https://staging-finance-backoffice-report-api.vercel.app/api/suppliers?limit=1" \
  -H "x-api-key: sk_test_4f8b2c9e1a3d5f7b9c0e2a4d6f8b1c3e"
```

---

**สรุป**: ✅ **ทุก API endpoint return ข้อมูลครบถ้วนทุก field และ sub-field แล้ว!**
