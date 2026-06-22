export const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, (x) => x === "Đ" ? "D" : "d").toLowerCase();
