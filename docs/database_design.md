# Database Design Decisions

## เหตุผลที่แยก `trade_exits` ออกเป็นตารางใหม่ (Why separate trade_exits?)

ในระบบบันทึกการเทรด (Trading Journal) โดยเฉพาะระดับ Professional/Enterprise การจัดการ "จุดออก" (Exit Strategy) ไม่ใช่แค่การมีราคาขายราคาเดียว แต่มีความซับซ้อนมากกว่านั้น:

1.  **Partial Take Profit (การแบ่งขาย):**
    - เทรดเดอร์มักไม่ได้ขาย 100% ที่ราคาเดียว อาจจะแบ่งขาย 3 ไม้ เช่น
        - TP 1: ขาย 50% ที่ราคา A
        - TP 2: ขาย 30% ที่ราคา B
        - TP 3: ขาย 20% ที่ราคา C
    - การเก็บข้อมูลแบบนี้ในตาราง `trade_journals` (ตารางแม่) จะทำได้ยาก (ต้องสร้าง column tp1, tp2, tp3... ซึ่งไม่ยืนหยุ่น)

2.  **Flexible Stop Loss (Trailing Stop):**
    - บางครั้งอาจมีการขยับ SL หรือมี SL หลายระดับสำหรับ Position ที่ Scale in เข้ามา การแยกตารางทำให้สามารถ track ประวัติการตั้งค่าเหล่านี้ได้ง่ายกว่า

3.  **Data Normalization (Database Principle):**
    - ความสัมพันธ์เป็นแบบ **One-to-Many** (1 Journal มีได้หลาย Exit Points)
    - การแยกตาราง (Normalization) ทำให้โครงสร้างข้อมูลสะอาด ลดความซ้ำซ้อน และ Query ง่ายเมื่อต้องการคำนวณกำไร/ขาดทุนรวมจากหลายๆ จุดออก

### สรุป
การแยก `trade_exits` ทำให้ระบบรองรับกลยุทธ์การเทรดขั้นสูง (Advanced Trading Strategies) ได้อย่างยืดหยุ่นและเป็นระบบมากขึ้นครับ
