import React, { useState } from 'react';
import { Building, Image, Store, ArrowRight, Languages, Sun, Moon } from 'lucide-react';

const CreateCompany = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    logo: null,
    type: '',
    country: 'الأردن', // ثابت
    currency: 'JOD'    // ثابت
  });

  return (
    <div className="min-h-screen bg-background p-6">
      {/* هيدر التبديل (لغة ولون) */}
      <div className="flex justify-end gap-4 mb-10">
        <button className="flex items-center gap-2 p-2 rounded-full bg-secondary">
          <Languages size={20} /> <span className="text-sm">AR/EN</span>
        </button>
        <button className="p-2 rounded-full bg-secondary">
          <Sun size={20} className="dark:hidden" />
          <Moon size={20} className="hidden dark:block" />
        </button>
      </div>

      <div className="max-w-xl mx-auto bg-card p-8 rounded-2xl shadow-lg border border-border">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary">Jo Pilot</h1>
        <p className="text-center text-muted-foreground mb-8">خطوات بسيطة لنبدأ مشروعك في الأردن</p>

        {/* الخطوة 1: الاسم والشعار */}
        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium">اسم الشركة</label>
            <div className="relative">
              <Building className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <input 
                type="text" 
                placeholder="مثلاً: متجر الصقر" 
                className="w-full p-3 pl-10 border rounded-lg"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <label className="block text-sm font-medium">شعار الشركة (اختياري)</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-secondary/50 cursor-pointer">
              <Image className="mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">اضغط لرفع الشعار</p>
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-primary text-white p-3 rounded-lg flex items-center justify-center gap-2">
              التالي <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* الخطوة 2: نوع المتجر */}
        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium">نوع المتجر / النشاط</label>
            <select 
              className="w-full p-3 border rounded-lg"
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="">اختر النوع...</option>
              <option value="supermarket">سوبر ماركت</option>
              <option value="restaurant">مطعم / كافيه</option>
              <option value="clothing">ملابس</option>
              <option value="other">أخرى</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="w-1/3 border p-3 rounded-lg">رجوع</button>
              <button onClick={() => setStep(3)} className="w-2/3 bg-primary text-white p-3 rounded-lg">التالي</button>
            </div>
          </div>
        )}

        {/* الخطوة 3: التأكيد */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 text-green-700 rounded-lg">
              جاهز للإطلاق! العملة المثبتة هي <b>الدينار الأردني (JOD)</b>.
            </div>
            <button className="w-full bg-primary text-white p-4 rounded-lg font-bold">إنشاء الشركة الآن</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateCompany;
