import { Container } from 'react-bootstrap';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import ENV from '@/lib/constants/environmentVariables';
import useInfo from '@/lib/swr-hooks/useInfo';

function OverlayEditorPage() {
    const router = useRouter();
    const { user, isLoading } = useInfo();

    return (
        <Container>
            <NextSeo
                title="Overlay Editor"
                openGraph={{
                    url: `${ENV.BASE_URL}/overlayeditor`,
                }}
            />
            <h1>Overlay Editor</h1>
        </Container>
    );
}

export default OverlayEditorPage;