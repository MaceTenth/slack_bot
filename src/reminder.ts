import { type Handler, schedule } from "@netlify/functions";
import {getToDoItemsFromNotion} from './util/notion';
import {buildingBlocks,slackApi} from './util/slack';

const postOpenIssuesFromNotionToSlack: Handler = async () =>{
    const issues = await getToDoItemsFromNotion();

    await slackApi('chat.postMessage',{
        channel: process.env.SLACK_CHANNEL,
        blocks: [
            buildingBlocks.section({
                text: [
                    'Here are the open issues of this week: ',
                    '',
                    ...issues.map(
                        (issue)=> `- ${issue.opinion} crises level- ${issue.spiceLevel}`,
                    ),
                    '',
                    `See all open issues on <https://notion.com/${process.env.NOTION_DATABASE_ID}|in Notion>`,

                ].join('\n')
            })
        ]
    })

    return {
        statusCode: 200,
    }
}

export const handler = schedule('0 0 1 * *',postOpenIssuesFromNotionToSlack);