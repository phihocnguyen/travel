export const AUTH_ERRORS:Record<string,string>={
  "email-unverified":"Vui lòng sử dụng tài khoản Google đã xác minh email.",
  "account-conflict":"Email này đã liên kết với tài khoản khác. Vui lòng liên hệ ban tổ chức.",
  "account-save-failed":"Chưa lưu được tài khoản. Vui lòng thử đăng nhập lại.",
  "account-disabled":"Tài khoản đã bị khóa. Vui lòng liên hệ ban tổ chức.",
  "google-not-configured":"Đăng nhập Google hiện chưa sẵn sàng. Vui lòng liên hệ ban tổ chức.",
  "google-denied":"Bạn đã huỷ đăng nhập Google. Bạn có thể thử lại khi sẵn sàng.",
  "invalid-state":"Phiên đăng nhập đã hết hạn. Vui lòng thử lại.",
  "token-exchange-failed":"Google chưa thể hoàn tất đăng nhập. Vui lòng thử lại.",
  "profile-fetch-failed":"Không thể đọc hồ sơ Google. Vui lòng thử lại.",
  "google-unreachable":"Chưa thể kết nối tới Google. Vui lòng thử lại sau.",
  "profile-incomplete":"Tài khoản Google không trả về địa chỉ email.",
};
export type AuthSearchParams=Promise<Record<string,string|string[]|undefined>>;
export const firstParam=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
