import NextHead from 'next/head'

export default function Head({title}: {title: string}){
    return(
        <NextHead>
            <title>{title}</title>
            <link rel="shortcut icon" href="/favicon.svg" />
            <meta name="description" content="ProdBoost jest darmową aplikacją dla przedsiębiorców produkcyjnych pozwalającą przechowywać stan magazynowy oraz wiele więcej."/>
            <meta charSet="utf-8"/>
            <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            <meta property="og:image" content="https://ia.media-imdb.com/images/rock.jpg" />
            <meta property="og:locale" content="pl_PL" />
        </NextHead>
    )
}