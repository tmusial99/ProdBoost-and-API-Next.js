import { GetServerSidePropsContext } from 'next';
import { useEffect, useState } from 'react';
import { AppProps } from 'next/app';
import { getCookie, setCookies } from 'cookies-next';
import { MantineProvider, ColorScheme, ColorSchemeProvider } from '@mantine/core';
import { NotificationsProvider } from '@mantine/notifications';
import '../styles/styles.css'
import { SessionProvider } from 'next-auth/react';
import { Router } from 'next/router';
import ProgressBar from "@badrap/bar-of-progress";
import Footer from '../components/Footer';
import { useColorScheme } from '@mantine/hooks';

const progress = new ProgressBar({
  size: 3,
  color: '#0075fa',
  delay: 100
});

Router.events.on('routeChangeStart', () => progress.start()); 
Router.events.on('routeChangeComplete', () => progress.finish()); 
Router.events.on('routeChangeError', () => progress.finish()); 

export default function App(props: AppProps & { colorScheme: ColorScheme }) {
  const { Component, pageProps } = props;
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(props.colorScheme);

  useEffect(() => {
    if(props.colorScheme === undefined) setColorScheme(preferredColorScheme)
  }, [preferredColorScheme])

  const toggleColorScheme = (value?: ColorScheme) => {
    const nextColorScheme = value || (colorScheme === 'dark' ? 'light' : 'dark');
    setColorScheme(nextColorScheme);
    setCookies('mantine-color-scheme', nextColorScheme, { maxAge: 60 * 60 * 24 * 60 });
  };

  return (
    <>
      <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
        <MantineProvider theme={{ colorScheme }} withGlobalStyles withNormalizeCSS>
          <NotificationsProvider>
            <SessionProvider session={pageProps?.session}>
              <Component {...pageProps}/>
              <Footer/>
            </SessionProvider>
          </NotificationsProvider>
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  );
}

App.getInitialProps = ({ ctx }: { ctx: GetServerSidePropsContext }) => ({
  colorScheme: getCookie('mantine-color-scheme', ctx),
});
