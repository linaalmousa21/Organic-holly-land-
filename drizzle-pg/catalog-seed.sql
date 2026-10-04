-- Organic Holy Land catalog seed for Supabase PostgreSQL.
-- Apply after 0000_tidy_spiral.sql has created the tables.
-- Images from /manus-storage are intentionally omitted because they are tied to the old Manus storage.

INSERT INTO "categories" ("id", "name", "note", "emoji", "sortOrder", "isFeatured") VALUES
  (1, 'زيت الزيتون', 'معصور على البارد', '🫒', 1, TRUE),
  (2, 'العسل', 'خام من مراعي حوران', '🍯', 2, TRUE),
  (3, 'الزعتر', 'خلطة دارنا اليومية', '🌿', 3, TRUE),
  (4, 'الألبان', 'طازجة من مزارعنا', '🥣', 4, TRUE),
  (5, 'مؤونة البيت', 'أصناف تشبه البيت', '🍃', 5, FALSE),
  (6, 'موسمنا', 'اختيارات الموسم', '✨', 6, FALSE)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "note" = EXCLUDED."note",
  "emoji" = EXCLUDED."emoji",
  "sortOrder" = EXCLUDED."sortOrder",
  "isFeatured" = EXCLUDED."isFeatured";

INSERT INTO "products" (
  "id", "categoryId", "name", "subtitle", "price", "unitLabel", "tag", "image",
  "art", "emoji", "stockQuantity", "lowStockThreshold", "sortOrder", "isActive"
) VALUES
  (1, 1, 'زيت زيتون بكر ممتاز', 'معصور على البارد من زيتون شمال الأردن', 12.00, '500 مل', 'حصاد الموسم', NULL, 'olive-art', '🫒', 20, 5, 1, TRUE),
  (2, 2, 'عسل جبلي خام', 'من مراعي حوران، بلا إضافات', 8.50, '250 غ', 'الأكثر طلباً', NULL, 'honey-art', '🍯', 20, 5, 2, TRUE),
  (3, 3, 'زعتر بلدي مع السمسم', 'خلطة دارنا اليومية، محمصة بعناية', 3.50, '250 غ', 'خلطة دارنا', NULL, 'thyme-art', '🌿', 20, 5, 3, TRUE),
  (4, 5, 'ورق عنب بلدي', 'محفوظ بماء وملح، جاهز لطبخة البيت', 4.75, '700 غ', NULL, NULL, 'grape-art', '🍃', 20, 5, 4, TRUE),
  (5, 4, 'لبنة بالزعتر', 'لبن بلدي كثيف مع رشة من زعترنا', 3.25, '400 غ', 'طازج', NULL, 'labneh-art', '🥣', 20, 5, 5, TRUE),
  (6, 5, 'دبس رمان أصلي', 'مركز من رمان الموسم، حامض ومتوازن', 5.00, '330 مل', NULL, NULL, 'pomegranate-art', '❤️', 20, 5, 6, TRUE)
ON CONFLICT ("id") DO UPDATE SET
  "categoryId" = EXCLUDED."categoryId",
  "name" = EXCLUDED."name",
  "subtitle" = EXCLUDED."subtitle",
  "price" = EXCLUDED."price",
  "unitLabel" = EXCLUDED."unitLabel",
  "tag" = EXCLUDED."tag",
  "image" = EXCLUDED."image",
  "art" = EXCLUDED."art",
  "emoji" = EXCLUDED."emoji",
  "stockQuantity" = EXCLUDED."stockQuantity",
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

SELECT setval(pg_get_serial_sequence('"categories"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "categories"), 1), TRUE);
SELECT setval(pg_get_serial_sequence('"products"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "products"), 1), TRUE);
