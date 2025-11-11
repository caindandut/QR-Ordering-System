import { useRouteError, Link } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4">
      <h1 className="text-4xl font-bold">Ối! Lỗi rồi!</h1>
      <p className="mt-4">Đã có lỗi không mong muốn xảy ra.</p>
      <p className="mt-2 text-gray-500">
        <i>{error.statusText || error.message}</i>
      </p>
      <Link to="/" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md">
        Quay về Trang chủ
      </Link>
    </div>
  );
}