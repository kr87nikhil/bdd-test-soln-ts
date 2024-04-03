interface SmartDevice {
    id?: number
    name: string
    data: AdditionalDetails | null
    createdAt?: Date
}

interface AdditionalDetails {
    capacity?: string,
    color?: Colour,
    description?: string,
    generation?: string,
    price?: number,
    year?: number,
    'capacity GB'?: string,
    'Case Size'?: string,
    'CPU model'?: string,
    'Hard disk size'?: string,
    'Screen size'?: number,
    'Strap Colour': Colour,
}

enum Colour {
    Blue = 'Blue',
    Brown = 'Brown',
    CloudyWhite = 'Cloudy White',
    Elderberry = 'Elderberry',
    Purple = 'Purple',
    Red = 'Red'
}

export { Colour }
export type { SmartDevice as SmartDeviceType }
