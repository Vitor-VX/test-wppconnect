export function isOwnMessage(client: any, message: any): boolean {
    if (message.fromMe) return true;

    const from = message.from || message.sender?.id || "";
    const to = message.to || "";
    if (from === to) return true;

    const selfIds = [
        client.session,
        client.session?.split("@")[0],
        client.info?.wid?._serialized,
        client.info?.me?._serialized,
    ].filter(Boolean);

    return selfIds.some(id => from.includes(id) || to.includes(id));
};