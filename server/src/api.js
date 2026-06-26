// هذا الكود يرسل بيانات اللاعب للسيرفر
export async function syncToServer(state, discordUser) {
    try {
        const stats = state.stats;
        const dataToSend = {
            discord_id: discordUser.id,
            username: discordUser.username,
            avatar: discordUser.avatar,
            level: state.level,
            exp: state.exp,
            str: stats.STR,
            agi: stats.AGI,
            vit: stats.VIT,
            intl: stats.INT,
            sense: stats.SENSE,
        };

        const response = await fetch('https://sololeveling-mmo-server.onrender.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
        });

        return await response.json();
    } catch (err) {
        console.error("فشل المزامنة مع السيرفر:", err);
    }
}