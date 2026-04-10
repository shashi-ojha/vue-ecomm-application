export function exportProductsToCSV(products: any[]) {
  const headers = ["id", "title", "brand", "category", "price", "stock"];
  const rows = products.map(p => [
    p.id, p.title, p.brand, p.category, p.price, p.stock
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach(r => (csv += r.join(",") + "\n"));

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "products.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
}