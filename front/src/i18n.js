import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fa: {
    translation: {
      "app_name": "شجره نامه",
      "slogan": "درخت خانوادگی خود را ترسیم کنید",
      "landing_tagline": "با تریلی، ریشه‌های خود را ثبت، متصل و برای همیشه حفظ کنید.",
      "get_started": "شروع رایگان",
      "login": "ورود",
      "register": "ثبت‌نام",
      "dashboard": "داشبورد",
      "logout": "خروج",
      "features": "ویژگی‌ها",
      "pricing": "تعرفه‌ها",
      "about": "درباره ما",
      "create_tree": "ساخت درخت جدید",
      "tree_name": "نام درخت",
      "owner": "مالک",
      "editor": "ویرایشگر",
      "visitor": "بیننده",
      "save": "ذخیره",
      "edit": "ویرایش",
      "delete": "حذف",
      "add_node": "افزودن عضو جدید",
      "cancel": "لغو",
      "biography": "زندگینامه",
      "photo_album": "آلبوم تصاویر",
      "upload_photo": "بارگذاری تصویر",
      "no_photos": "هنوز تصویری بارگذاری نشده است.",
      "add_collaborator": "افزودن همکار",
      "collaborators": "همکاران",
      "email": "ایمیل",
      "role": "نقش",
      "first_name": "نام",
      "last_name": "نام خانوادگی",
      "password": "رمز عبور",
      "already_registered": "قبلاً ثبت‌نام کرده‌اید؟ ورود",
      "need_account": "حساب کاربری ندارید؟ ثبت‌نام",
      "no_trees": "شما هنوز هیچ درختی ندارید. یکی بسازید!",
      "relationship": "نسبت",
      "spouse": "همسر",
      "child": "فرزند",
      "parent": "والد",
      "back_to_dashboard": "بازگشت به داشبورد",
      "save_success": "تغییرات با موفقیت ذخیره شد.",
      "upload_success": "تصویر با موفقیت بارگذاری شد."
    }
  },
  en: {
    translation: {
      "app_name": "Treely",
      "slogan": "Visualize your family tree",
      "landing_tagline": "Discover, connect, and preserve your heritage forever with Treely.",
      "get_started": "Get Started",
      "login": "Login",
      "register": "Register",
      "dashboard": "Dashboard",
      "logout": "Logout",
      "features": "Features",
      "pricing": "Pricing",
      "about": "About",
      "create_tree": "Create New Tree",
      "tree_name": "Tree Name",
      "owner": "Owner",
      "editor": "Editor",
      "visitor": "Visitor",
      "save": "Save",
      "edit": "Edit",
      "delete": "Delete",
      "add_node": "Add Member",
      "cancel": "Cancel",
      "biography": "Biography",
      "photo_album": "Photo Album",
      "upload_photo": "Upload Photo",
      "no_photos": "No photos uploaded yet.",
      "add_collaborator": "Add Collaborator",
      "collaborators": "Collaborators",
      "email": "Email",
      "role": "Role",
      "first_name": "First Name",
      "last_name": "Last Name",
      "password": "Password",
      "already_registered": "Already registered? Login",
      "need_account": "Don't have an account? Register",
      "no_trees": "You don't have any trees yet. Create one!",
      "relationship": "Relationship",
      "spouse": "Spouse",
      "child": "Child",
      "parent": "Parent",
      "back_to_dashboard": "Back to Dashboard",
      "save_success": "Changes saved successfully.",
      "upload_success": "Photo uploaded successfully."
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fa', // default is Persian
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
