import { provinces, districts, subDistricts } from "@bilions/thailand-address";

// Helper ฟังก์ชันลบคำว่า "เขต " หรือ "อำเภอ " ด้านหน้าเพื่อความสะอาดและสม่ำเสมอ
const cleanDistrictName = (name) => {
  if (!name) return "";
  return name.replace(/^(เขต|อำเภอ)\s*/, "").trim();
};

/**
 * ดึงรายชื่อจังหวัดทั้งหมดในประเทศไทย (77 จังหวัด)
 */
export const getProvinces = () => {
  return provinces
    .map((p) => p.name_in_thai)
    .sort((a, b) => a.localeCompare(b, "th"));
};

/**
 * ดึงรายชื่ออำเภอ/เขต ทั้งหมดของจังหวัดที่เลือก
 */
export const getDistricts = (provinceName) => {
  if (!provinceName) return [];
  const foundProvince = provinces.find((p) => p.name_in_thai === provinceName);
  if (!foundProvince) return [];

  return districts
    .filter((d) => d.province_id === foundProvince.id)
    .map((d) => cleanDistrictName(d.name_in_thai))
    .sort((a, b) => a.localeCompare(b, "th"));
};

/**
 * ดึงรายชื่อตำบล/แขวง ทั้งหมดของอำเภอและจังหวัดที่เลือก
 */
export const getSubDistricts = (provinceName, districtName) => {
  if (!provinceName || !districtName) return [];

  const foundProvince = provinces.find((p) => p.name_in_thai === provinceName);
  if (!foundProvince) return [];

  const cleanTargetDist = cleanDistrictName(districtName);
  const foundDistrict = districts.find(
    (d) =>
      d.province_id === foundProvince.id &&
      cleanDistrictName(d.name_in_thai) === cleanTargetDist
  );

  if (!foundDistrict) return [];

  return subDistricts
    .filter((s) => s.district_id === foundDistrict.id)
    .map((s) => ({
      name: s.name_in_thai,
      zip: String(s.zip_code || ""),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "th"));
};

/**
 * ดึงรหัสไปรษณีย์ของตำบลที่เลือก
 */
export const getZipCode = (provinceName, districtName, subDistrictName) => {
  if (!provinceName || !districtName || !subDistrictName) return "";
  const list = getSubDistricts(provinceName, districtName);
  const foundSub = list.find((s) => s.name === subDistrictName);
  return foundSub ? foundSub.zip : "";
};
