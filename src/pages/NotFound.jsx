import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="status">
      <h1>페이지를 찾을 수 없어요</h1>
      <Link to="/" className="btn primary">
        시세 보러 가기
      </Link>
    </div>
  );
}
