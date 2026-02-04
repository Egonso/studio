export interface Article {
    id: string;
    text: string;
    type: 'article';
}

export interface Chapter {
    id: string;
    title: string;
    articles: Article[];
}

export interface Recital {
    id: string;
    number: string;
    text: string;
    type: 'recital';
}

export interface Annex {
    id: string;
    text: string;
    type: 'annex';
}

export interface LawData {
    recitals: Recital[];
    chapters: Chapter[];
    annexes: Annex[];
}
