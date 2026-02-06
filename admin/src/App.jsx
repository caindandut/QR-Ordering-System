import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="flex justify-center items-center h-screen flex-col gap-4">
      <h1 className="text-3xl font-bold underline text-blue-500">
        Xin chào, Tailwind đã chạy!
      </h1>
      
      <Button>Đây là nút của Shadcn</Button>
      <Button variant="destructive">Nút Hủy (Destructive)</Button>
    </div>
  )
}
export default App
