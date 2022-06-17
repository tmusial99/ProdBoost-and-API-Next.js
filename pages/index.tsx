import { Box, Button, Center, Group, Text, Title } from '@mantine/core';
import Link from 'next/link';
import Head from '../components/Head';

export default function HomePage() {
  return (
    <>
      <Head title='ProdBoost'/>
      <Box px={10} sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          flexGrow: 1
      }}>
          <Box sx={{fontSize: '100px'}}>🚧</Box>
          <Title order={1} align='center'>Trwają prace nad budową strony głównej.</Title>
          <Title order={3} mt={20} align='center'>Przejdź do aplikacji za pomocą przycisku poniżej.</Title>
          <Group direction="column" grow>
            <Link href='dashboard'>
            <Button mt={20} component='a' href='dashboard'>Panel klienta</Button>
            </Link>
          </Group>
        </Box>
    </>
  );
}
