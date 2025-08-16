import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head, Search } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import "./globals.css"

export const metadata = {
  title: "Incerto",
};

// const banner = (
//   <Banner storageKey="some-key">New Version is released !!!</Banner>
// );
const navbar = (
  <Navbar
    logo={<b> Incerto </b>}
    logoLink={"https://incerto.in"}
    //projectLink=""
    //chatLink=""
  />
);
const footer = (
  <Footer> © {new Date().getFullYear()} Copyright Incerto Technologies Pvt Ltd. All rights reserved.</Footer>
);

const search = <Search placeholder="Search..."></Search>;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head
      // ... Your additional head options
      >
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>
      <body>
        <Layout
          // banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/Incerto-Technologies/docs"
          footer={footer}
          search={search}
          editLink={null}
          feedback={{ content: null }}
          // ... Your additional layout options
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
