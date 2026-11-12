export async function callMSGraph(endpoint, token) {

    const headers = new Headers();
    const bearer = `Bearer ${token}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    // a failed listing throws with its status, so the page shows why instead of spinning (#29)
    const response = await fetch(endpoint, options);
    if (!response.ok) throw new Error(`file listing failed: ${response.status} ${response.statusText}`);
    return (await response.json()).value;
}