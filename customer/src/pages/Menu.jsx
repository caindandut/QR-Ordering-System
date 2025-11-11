export default function MenuPage() {
  // Lấy dữ liệu từ localStorage để chào
  const name = localStorage.getItem('customer_name');
  const table = localStorage.getItem('table_id');
  
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold">Chào mừng, {name}!</h1>
      <p>Bạn đang ở Bàn số: {table}</p>
    </div>
  );
}