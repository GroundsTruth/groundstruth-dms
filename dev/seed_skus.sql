-- GroundsTruth DMS - SKU master seed (from Jaypee June 2026 workbook)
-- NOTE: mrp, hsn, tax_slab are TODO - confirm with client before invoicing build

create table if not exists skus (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text,
  pack_size text,
  rate_per_case numeric,
  mrp numeric,            -- TODO from client
  hsn text,               -- TODO from client
  tax_slab numeric,       -- TODO from client (GST %)
  units_per_case int,     -- TODO confirm
  active boolean default true,
  created_at timestamptz default now()
);

insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU001','CSD Can Cola - 330 ML','Cola','330 ML',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU002','CSD Can Lemon - 185/200 ML','Lemon','200 ML',492.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU003','CSD Can Zero 185/200ml - 185/200 ML','Cola','200ML',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU004','CSD Cola - 185/200 ML','Cola','200 ML',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU005','CSD Cola - 1LT','Cola','1LT',400.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU006','CSD Cola - 200 ML','Cola','200 ML',240.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU007','CSD Cola - 2LT','Cola','2LT',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU008','CSD Cola - 500 ML','Cola','500 ML',395.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU009','CSD Lemon - 1LT','Lemon','1LT',400.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU010','CSD Lemon - 200 ML','Lemon','200 ML',240.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU011','CSD Lemon - 2Ltr','Lemon','2LTR',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU012','CSD Lemon - 500 ML','Lemon','500 ML',395.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU013','CSD Orange - 185/200 ML','Orange','200 ML',492.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU014','CSD Orange - 1LT','Orange','1LT',400.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU015','CSD Orange - 200 ML','Orange','200 ML',240.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU016','CSD Orange - 2LT','Orange','2LT',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU017','CSD Orange - 500 ML','Orange','500 ML',395.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU018','Campa Club Soda - 500 ML','Soda','500 ML',215.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU019','Campa Cola - 2.25 Ltr','Cola','2.25 LTR',677.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU020','Campa Lemon - 2.25 Ltr','Lemon','2.25 LTR',677.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU021','Campa Orange - 2.25 Ltr','Orange','2.25 LTR',677.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU022','Energy Berry Kick - 150 PET','Energy','',225.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU023','Energy Berry Kick - 250 ML PET','Energy','250 ML',450.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU024','Gold Boost Energy Can - 185 ML','Energy','185 ML',625.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU025','Gold Boost Energy Can - 330 ML','Energy','330 ML',495.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU026','Gold Boost Energy Pet  - 300 ML','Energy','300 ML',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU027','Gold Boost Energy Pet - 300 ML','Energy','300 ML',495.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU028','Jeera 150ml - 150 ML','Other','150ML',225.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU029','Mix - 500ML','Other','500ML',770.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU030','Power UP - 1Ltr','Other','1LTR',400.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU031','Power UP - 200 ML','Other','200 ML',240.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU032','Power UP - 500 ML','Other','500 ML',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU033','REVENUE SUMMARY BY VAN','Other','',Van 1) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU034','Rasiki Mango - 150 ML','Juice/Other','150 ML',215.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU035','Rasiki Mango - 500 ML','Juice/Other','500 ML',482.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU036','Rasiki Mango Tetra - 125 ML','Juice/Other','125 ML',277.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU037','Rasiki Mix - 150 ML Pet','Juice/Other','150 ML',215.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU038','Rasiki Nimbu Pani - 150 ML','Juice/Other','150 ML',215.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU039','Raskik Gluco Energy - 150 ml','Energy','150 ML',215.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU040','Revenue Share (%)','Other','',0.1855957876) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU041','Suncrush Mango - 200 Ml','Juice/Other','200 ML',362.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU042','Suncrush Mango 500ml - 500 ML','Juice/Other','500ML',770.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU043','Suncrush Mixed Fruit - 200 ML PET','Other','200 ML',362.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU044','Suncrush Orange PET - 200 ML','Orange','200 ML',362.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU045','TOTAL','Other','',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU046','Total Qty Sold','Other','',1826) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU047','Total Revenue (₹)','Other','',567187) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU048','Water - 1 Ltr','Water','1 LTR',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU049','Water - 1.5Ltr','Water','1.5LTR',115.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU050','Water - 250 ML','Water','250 ML',null) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU051','Water - 750 ML','Water','750 ML',155.0) on conflict (code) do nothing;
insert into skus (code,name,category,pack_size,rate_per_case) values ('SKU052','Water Gold - 750 ML','Water','750 ML',192.0) on conflict (code) do nothing;