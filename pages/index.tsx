import { Button, Center, Text } from '@mantine/core';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Center style={{marginTop:'20px'}}>
        <Link href='dashboard'>
          <Button component='a' href='dashboard'>Panel klienta</Button>
        </Link>
      </Center>
    </>
  );
}
