-- Catalog seed for Organic Holy Land. Applied to the WebDev database on 2026-09-11.
INSERT INTO `categories` (`id`,`name`,`note`,`emoji`,`sortOrder`,`isFeatured`) VALUES
(1,'زيت الزيتون','معصور على البارد','🫒',1,1),
(2,'العسل','خام من مراعي حوران','🍯',2,1),
(3,'الزعتر','خلطة دارنا اليومية','🌿',3,1),
(4,'الألبان','طازجة من مزارعنا','🥣',4,1),
(5,'مؤونة البيت','أصناف تشبه البيت','🍃',5,0),
(6,'موسمنا','اختيارات الموسم','✨',6,0);

INSERT INTO `products` (`id`,`categoryId`,`name`,`subtitle`,`price`,`unitLabel`,`tag`,`image`,`art`,`emoji`,`sortOrder`,`isActive`) VALUES
(1,1,'زيت زيتون بكر ممتاز','معصور على البارد من زيتون شمال الأردن',12.00,'500 مل','حصاد الموسم','/manus-storage/olive-oil_368c793e.jpg','olive-art','🫒',1,1),
(2,2,'عسل جبلي خام','من مراعي حوران، بلا إضافات',8.50,'250 غ','الأكثر طلباً','/manus-storage/honey-preview_5a7b9acf.jpg','honey-art','🍯',2,1),
(3,3,'زعتر بلدي مع السمسم','خلطة دارنا اليومية، محمصة بعناية',3.50,'250 غ','خلطة دارنا','/manus-storage/dish-preview_8a82762c.jpg','thyme-art','🌿',3,1),
(4,5,'ورق عنب بلدي','محفوظ بماء وملح، جاهز لطبخة البيت',4.75,'700 غ',NULL,'/manus-storage/grape-leaves_a282bafc.jpg','grape-art','🍃',4,1),
(5,4,'لبنة بالزعتر','لبن بلدي كثيف مع رشة من زعترنا',3.25,'400 غ','طازج','/manus-storage/bread-preview_70405922.jpg','labneh-art','🥣',5,1),
(6,5,'دبس رمان أصلي','مركز من رمان الموسم، حامض ومتوازن',5.00,'330 مل',NULL,'/manus-storage/dish-preview_8a82762c.jpg','pomegranate-art','❤️',6,1);
