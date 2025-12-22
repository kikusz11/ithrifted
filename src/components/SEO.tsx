import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    scripts?: Array<{ type: string; innerHTML: string }>;
}

export default function SEO({
    title = 'iThrifted - Prémium Vintage & Streetwear | Budapest',
    description = 'Fedezd fel Budapest prémium vintage és streetwear üzletét. Egyedi, válogatott márkás használt ruhák (Nike, Adidas, Ralph Lauren, Carhartt) a belváros szívében. 1132 Budapest, Victor Hugo utca 2.',
    image = '/logo.png',
    url = 'https://ithrifted.hu',
    scripts
}: SEOProps) {

    const siteTitle = title.includes('iThrifted') ? title : `${title} | iThrifted`;

    return (
        <Helmet>
            {/* Basic Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta charSet="utf-8" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={siteTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />

            {/* JSON-LD Structured Data */}
            {scripts && scripts.map((script, index) => (
                <script key={index} type={script.type}>
                    {script.innerHTML}
                </script>
            ))}
        </Helmet>
    );
}
