import { ActionIcon, Anchor, Avatar, Badge, Button, Divider, Group, Menu, Switch, Text, useMantineColorScheme } from '@mantine/core';
import { SunIcon, MoonIcon } from '@modulz/radix-icons';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {  BuildingFactory2, Camera, Key, Logout, MoonStars, Settings, Tool, Users } from 'tabler-icons-react';

export default function Navbar(){
  const {data: session} = useSession()
    return(
      <nav className='hideOnPrint'>
        <Group position='center' sx={(theme) => ({
            backgroundColor:
                theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]
        })}>
            <Group 
            position='apart' 
            px={20}
            py={10}
            style={{maxWidth:'1100px', width:'100%'}}
            >
              {session && (
                <>
                <Group direction='column' noWrap>
                  <Group spacing={5} noWrap>
                    <Avatar radius='xl' src={session.user.image_url}/>
                    <Text weight={500} size='lg'>{session.user?.name}</Text>
                    {session.user.role === 'CompanyOwner' && (
                      <Badge color="yellow" size='xs' variant="filled">Admin</Badge>
                    )}
                    
                  </Group>
                    
                  <Link href='/dashboard'>
                      <Anchor href='/dashboard' variant='text'>
                          <Group spacing={5} align='center' noWrap>           
                              <Avatar radius='xl'><BuildingFactory2/></Avatar>
                              <Text weight={500} size='lg'>{session.user.companyName}</Text>
                          </Group>
                      </Anchor>
                  </Link>
                </Group>
                <MenuWindow session={session}/>
                </>
                )}
                {!session && (<ColorSchemeToggle/>)}
            </Group>
        </Group>
      </nav>
    )
}


function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  return (
    <Group position="center" ml={'auto'}>
      <ActionIcon
        onClick={() => toggleColorScheme()}
        size="xl"
        sx={(theme) => ({
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[0],
          color: theme.colorScheme === 'dark' ? theme.colors.yellow[4] : theme.colors.blue[6],
        })}
      >
        {colorScheme === 'dark' ? (
          <SunIcon width={20} height={20} />
        ) : (
          <MoonIcon width={20} height={20} />
        )}
      </ActionIcon>
    </Group>
  );
}

function MenuWindow({session}:any){
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  return(
      <Menu
      closeOnItemClick={false}
      ml={'auto'}
      control={
          <ActionIcon size='xl' sx={(theme) => ({
              backgroundColor:
                theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[0]
            })}
          >
              <Settings/>
          </ActionIcon>
      }>
          <Menu.Label>Interfejs</Menu.Label>
          <Menu.Item icon={<MoonStars size={14} />} onClick={() => toggleColorScheme()}>
            <Group>
              <Text inherit mr={10}>Tryb ciemny</Text>
              <Switch checked={colorScheme==='dark'} onChange={() => toggleColorScheme()} sx={{
                input:{
                  '&:hover':{
                    cursor: 'pointer'
                  }
                }
              }}/>
            </Group>
          </Menu.Item>
          <Divider />
          {session.user.role === 'CompanyOwner' && (
            <>
            <Menu.Label>Ustawienia administratora</Menu.Label>
            <Menu.Item icon={<Tool size={14} />} onClick={() => router.push('/dashboard/admin/company')}>Ustawienia firmy</Menu.Item>
            <Menu.Item icon={<Users size={14} />} onClick={() => router.push('/dashboard/admin/workers')}>Pracownicy</Menu.Item>
            <Divider />
            </>
          )}
          <Menu.Label>Ustawienia konta</Menu.Label>
          <Menu.Item icon={<Key size={14} />} onClick={() => router.push('/dashboard/account/changepassword')}>Zmień hasło</Menu.Item>
          <Menu.Item icon={<Camera size={14} />} onClick={() => router.push('/dashboard/account/changepicture')}>Zdjęcie profilowe</Menu.Item>
          <Menu.Item color='red' icon={<Logout size={14} />} onClick={() => signOut({callbackUrl: `${process.env.AXIOS_URL}/dashboard`})}>Wyloguj</Menu.Item>
      </Menu>
  )
}