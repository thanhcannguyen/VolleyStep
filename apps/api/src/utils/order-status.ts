
import { ORDER_STATUSES, type OrderStatus } from "../models/order.model";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
};

export const isValidOrderStatusTransition = (
    currentStatus: OrderStatus,
    nextStatus: OrderStatus
): boolean => {
    return ORDER_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
};

export const isOrderStatus = (value: string): value is OrderStatus => {
    return (ORDER_STATUSES as readonly string[]).includes(value);
};