import { sort } from "fast-sort";
import { atom } from "jotai";
import { InferType } from "yup";
import { orderApiSchema } from "../schemas/order";

export type IOrder = InferType<typeof orderApiSchema> & {
    orderId: number,
    status: number,
    createdAt: number,
    totalNetto: number,
    totalBrutto: number
}

export type ISortingOrdersPropertyNames = 'orderId' | 'createdAt' | 'totalNetto' | 'totalBrutto'
type ICurrentSortingOrders = [propertyName: ISortingOrdersPropertyNames, direction: 'asc' | 'desc']

export const allOrdersAtom = atom<IOrder[]>([])

export const selectedFilterForOrdersAtom = atom<'0' | '1' | '2' | '3' | '4' | '5' | '6'>('0')

export const selectedSortingForOrdersAtom = atom<ICurrentSortingOrders>(["orderId", 'asc'])

export const filteredAndSortedOrdersAtom = atom<IOrder[]>(
    (get) => {
        const allOrders = get(allOrdersAtom);
        const selectedFilter = get(selectedFilterForOrdersAtom);
        const selectedSorting = get(selectedSortingForOrdersAtom);

        const filteredOrders = selectedFilter === '0' ? allOrders : allOrders.filter(order => order.status === parseInt(selectedFilter));

        return selectedSorting[1] === 'asc' 
            ? sort(filteredOrders).asc(order => order[selectedSorting[0]])
            : sort(filteredOrders).desc(order => order[selectedSorting[0]])
    }
)

