export interface Contractor {
    id: string;
    name: string;
    rating: number;
    homeBase: {
        latitude: number;
        longitude: number;
    };
    distance?: number;
}
