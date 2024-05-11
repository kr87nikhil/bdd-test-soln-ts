interface Book {
    isbn: string      //13-digits International Standard Book Number
    title: string
    subTitle?: string // Optional subTitle property
    author: string
    publish_date: string
    publisher: string
    pages: number
    description: string
    website: string
}

export type { Book as BookType }
