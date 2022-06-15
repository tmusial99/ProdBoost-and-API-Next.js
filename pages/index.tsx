import { Button, Center, Text } from '@mantine/core';
import Link from 'next/link';
import Head from '../components/Head';

export default function HomePage() {
  return (
    <>
      <Head title='ProdBoost'/>
      <Center>
        <Link href='dashboard'>
          <Button mt={20} component='a' href='dashboard'>Panel klienta</Button>
        </Link>
      </Center>
    </>
  );
}
