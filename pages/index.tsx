import { Button, Center, Text } from '@mantine/core';
import Link from 'next/link';
import Head from '../components/Head';

export default function HomePage() {
  return (
    <>
      <Head title='ProdBoost'/>
      <Center style={{marginTop:'20px'}}>
        <Link href='dashboard'>
          <Button component='a' href='dashboard'>Panel klienta</Button>
        </Link>
      </Center>
    </>
  );
}
