import { Anchor, Breadcrumbs } from "@mantine/core";
import Link from "next/link";

export default function Navigation({items}: {items: Array<{title:string, href:string}>}){
    return(
        <Breadcrumbs my={20}>
            {items.map((item, index) => (
                <Link href={item.href} key={index}>
                    <Anchor href={item.href}>
                        {item.title}
                    </Anchor>
                </Link>
            ))}
        </Breadcrumbs>
    )
}