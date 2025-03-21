import OrderListView from '../orders/OrderListView'; 
import OAInput from '../oa_input/OAInput';

export const order_routes = [
    { path: '/orders', element: <OrderListView /> },
    { path: '/oa_input', element: <OAInput /> },
  ];