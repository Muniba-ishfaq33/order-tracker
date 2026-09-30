export const STATUSES = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

export const statusColor = {
  Placed: 'secondary',
  Preparing: 'warning',
  'Out for Delivery': 'info',
  Delivered: 'success',
  Cancelled: 'danger',
};

export const canCancel = (status) => status === 'Placed' || status === 'Preparing';