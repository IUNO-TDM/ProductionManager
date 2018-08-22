export class Order {
    id: string;
    offer: {
        id: String,
        bip21: String
    };
    items: [{
        dataId: String,
        amount: Number
    }];
    state: String;
    createdAt: string;
}
