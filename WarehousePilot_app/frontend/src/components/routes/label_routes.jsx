import LabelMaker from "../labels/LabelMaker";
import AllLabels from "../labels/AllLabels";

const ProtectedRoute = ({ element }) => {
  const isLoggedIn = !!localStorage.getItem('token');
  return isLoggedIn ? element : <Navigate to="/" />;
};

export const label_routes = [
    { path: '/label/:picklist_item_id', element: <ProtectedRoute element={<LabelMaker />} /> },
    { path: '/label/all/:order_id', element: <ProtectedRoute element={<AllLabels />} /> },
]
