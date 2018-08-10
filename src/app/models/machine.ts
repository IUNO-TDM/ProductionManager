export class Machine {
    id: string;
    displayName: string;
    variant: string;
    hostname: string;
    hsmIds: string[];
    cameraSnapshot: any;
    isOnline: boolean;
    isAuthenticated: boolean;
}
