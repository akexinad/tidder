import { ThemeProvider, CSSReset } from "@chakra-ui/core";
import { Provider, createClient } from "urql";

const client = createClient({
    url: "http://localhost:4000/graphql",
    fetchOptions: {}
});

import theme from "../theme";

function MyApp({ Component, pageProps }) {
    return (
        <Provider value={client}>
            <ThemeProvider theme={theme}>
                <CSSReset />
                <Component {...pageProps} />
            </ThemeProvider>
        </Provider>
    );
}

export default MyApp;
