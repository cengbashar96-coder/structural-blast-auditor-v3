# Extracted Thesis Pages 13-18

*OCR extracted using z-ai vision CLI from scanned Arabic/Russian engineering thesis about protective structures (تحصين) and dynamic blast calculations.*

---

## Page 13 (page_13_s.png)

### Table: Relative Values and Modification

| القيم المدخلة النسبية | قيمة التعديل |
|---|---|
| . r o | لا |
| . . 7 | زيادة قليلاً |
| . . V o | زيادة |
| ) | زيادة كبيرة |

### Equation: Modification coefficient for relative values based on angle of incidence φ

$$k_v = k_{ap}(\cos\varphi)^2 + k_b(\sin\varphi)^2$$

تستخدم المعادلة السابقة لتعديل قيم المعاملات النسبية حسب زاوية السقوط على السطح، حيث $k_{ap}$ و $k_b$ معاملات تعتمد على نوع السطح والظروف المحيطة. ويتم تحديد قيمة التعديل النهائية بناءً على القيم المدخلة من الجدول أعلاه. ويجب ملاحظة أن المعادلة تعتمد على الزاوية $\varphi$ بين اتجاه السقوط واتجاه السطح.

### Third equation for coefficients:

$$q = k_{gr} k_{coh} \frac{C^2}{3R} \omega f(\beta)$$

**ملاحظة:**

$K_{gr}$ معامل تعديل للقيم النسبية حسب نوع السطح واتجاه السقوط.

---

## Page 14 (page_14_s.png)

### Table: K_gr values based on explosion location

| $K_{gr}$ | إذا كان الإنفجار |
|---|---|
| على سطح الأرض أو قريب منه | إذا كان الإنفجار على سطح الأرض |
| في الهواء | إذا كان الإنفجار في الهواء |
| على سطح الماء أو قريب منه | إذا كان الإنفجار على سطح الماء |

### $K_{zab}$: معامل تعديل ارتفاع التفجير (Height correction coefficient)

- إذا كان $h \geq r$:

$$k_{zab} = 1$$

إذا كان $r_0$ أقل من المسافة بين مركز الإنفجار والنقطة المراد حساب الضغط فيها:

$$r_0 = 0.053\sqrt[3]{C}$$

- إذا كان المسافة بين مركز الإنفجار والنقطة المراد حساب الضغط فيها أكبر من $r$:

$$k_{zab} = 0.5$$

- إذا كان المسافة بين مركز الإنفجار والنقطة المراد حساب الضغط فيها أكبر من $r$:

$$k_{zab} = 0.2$$

الشكل (١٢) يوضح العلاقة بين معامل تعديل الإنفجار في الهواء ($k_{zab}$) والنسبة ($R$) بين المسافة من مركز الإنفجار إلى النقطة المراد حساب الضغط فيها إلى المسافة ($r_0$).

### $f(\beta)$: معامل تعديل الزاوية (Angle correction coefficient)

- إذا كان $r_0 < R \leq r_0$:

$$f(\beta) = 1$$

---

## Page 15 (page_15_s.png)

- إذا كانت $R > r$ أو $r$:

$$f(\beta) = 0.3 + 0.7\cos\beta$$

**ملاحظة:**

يتم استخدام المعادلة السابقة (لحساب الضغط الديناميكي للانفجار) في حالة التأثير المركزي

**شرط:**

$$\frac{\sqrt{C}\sqrt{R}}{T} \leq 1000$$

حيث:

$$T = \frac{2\pi}{\omega}$$

### الشكل (1-1): قذيفة جي بي يو - ٢٧ (GBU-27)

**ملاحظة:**
تم اختيار قذيفة جي بي يو - ٢٧ لأنها من القذائف التي تسبب أضراراً شديدة

- LENGTH: 19 feet 2 inches
- Retractable Tail Fins
- Warhead
- Adjustable Fins
- Laser Sensor

### الشكل (1-2): القذيفة المختارة

١٧

---

## Page 16 (page_16_s.png)

### الشكل (٢-١): التركيب الأساسي لجهاز الكشف عن المتفجرات بالأشعة السينية (باستخدام مادة التريتونال كمواد متفجرة نموذجية)

### الجدول (٢-١): خصائص المواد المستخدمة في المحاكاة

| الشكل | الكثافة | المادة |
|---|---|---|
| ... | كجم/سم³ | التريتونال |
| ٧٫٩ | كجم/سم³ | الحديد |
| سبيكة حديدية (TNT) ٧٫١٣ (كجم/سم³) (التريتونال) ٢٫٧ | - | الحديد |
| ... | كجم/سم³ | الألومنيوم |
| ١٫٨٧ | كجم/سم³ | المادة العازلة |

---

## Page 17 (page_17_s.png)

- المرحلة الثانية من المشروع:

إذا لم تكن هناك قيمة لـ j في قاعدة البيانات

### Soil/Rock Types:

- **clay stone**: الحجر الطيني (حجر طيني، ٢٠%)
- **silt stone**: الحجر الرملي (حجر طيني، ٢٠%)
- **sand stone**: الحجر الرملي
- **lime stone**: الحجر الكلسي

مسافة كل طبقة من بعضها البعض: ٥٠ متر

### (الشكل A) خريطة التشريح الطبقي للموقع (Stratigraphic map of site)

Layer diagram showing:
- silt Stone / clay Stone
- sand Stone
- lime Stone

- 60 m
- 90 m

نموذج التربة المختارة: التربة الصخرية (النوع A)

١٨

---

## Page 18 (page_18_s.png)

- رابعاً: تحليل الإصابة بالرصاص المضاد للدروع (Anti-armor penetration analysis)

من خلال التحليل الديناميكي والتحليل الإنشائي:

$$h = \lambda k \frac{P}{d^2} v \cos\left(\frac{\alpha + n\alpha}{2}\right)$$

**ملاحظة:**

- $h$ تمثل الإصابة بالرصاص المضاد للدروع (من خلال تحليل الديناميكا) وتم حسابها من خلال التحليل الإنشائي (انظر الفصل السادس)
- $\lambda$ تمثل معاملات تأثير الإصابة بالرصاص المضاد للدروع

معاملات $\lambda$

١٩

---

*Extraction completed. Pages 13-18 cover: blast pressure modification coefficients (k_v, K_gr, K_zab, f(β)), dynamic blast pressure formulas, GBU-27 munition specifications, material properties for simulation (Tritonal, iron, aluminum), geological/soil classification (Type A rock), and anti-armor penetration equations.*
