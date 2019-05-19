exports.main = async function(event, context) {
    try {
        const method = event.httpMethod;
        if (method === "GET") {
            if (event.path === "/") {
                const responseBody = {
                    "message": "Something Clever"
                };
                return {
                    statusCode: 200,
                    headers: {
                        "yeet": "yote",
                    },
                    body: JSON.stringify(responseBody) 
                }
            }
        }
    } catch(error) {
        const responseBody = error.stack || JSON.stringify(error, null, 2);
        return {
            statusCode: 500,
            headers: {
                "oh": "no"
            },
            body: JSON.stringify(responseBody)
        }
    }
}