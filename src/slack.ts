import type { Handler } from "@netlify/functions";
import { parse } from "querystring";
import {
  buildingBlocks,
  botModal,
  slackApi,
  verifyRequestFromSlack,
} from "./util/slack";
import { saveItemToNotion } from "./util/notion";

async function handleInterActivity(payload: SlackModalPayload) {
  const callback_id = payload.callback_id ?? payload.view.callback_id;
  
  switch (callback_id) {
	
    case "bothelper-modal":
      const modalData = payload.view.state.values;
      const fields = {
        opinion: modalData.opinion_block.opinion.value,
        spiceLevel:
          modalData.crises_mode_block.crises_mode.selected_option.value,
        submitter: payload.user.name,
      };
	  await saveItemToNotion(fields)
	  
	 
	
      await slackApi("chat.postMessage", {
        channel: process.env.SLACK_CHANNEL,
		// text: `🛸 **Galactic Assistance Alert!** 🛸
		// Alright space cadets, one of our crew members <@${payload.user.id}> has encountered an alien problem!\n\n
		// His issue is ${fields.spiceLevel} 😨 and he says that: *${fields.opinion}*`,

        text: `🚨🎩 **MAGIC HELP HAT ACTIVATED!** 🎩🚨\n\n
				Hey team! <@${payload.user.id}> got their toes in a tangle and needs a sprinkle of our collective genius!\n\n
				His issue is ${fields.spiceLevel} 🔥 and he says that: *${fields.opinion}*`,
      });
      break;


	  case 'start-help-session':
		const channel = payload.channel?.id;
		const user_id  = payload.user.id;
		const thread_ts = payload.message.thread_ts ?? payload.message.ts;

		await slackApi('chat.postMessage',{
			channel,
			thread_ts,
			text: `Hey! <@${user_id}> if you need help all you need to do is run the \`/bothelper\` command!`
		})
		break;

    default:
      console.log(`No handler defined for ${callback_id}`);
      return {
        statusCode: 400,
        body: `No handler defined for ${callback_id}`,
      };
  }

  return {
	statusCode: 200,
	body: ''
  }
}

async function handleSlackSlashCommand(payload: SlackSlashCommandPayload) {
  switch (payload.command) {
    case "/bothelper":
      const response = await slackApi(
        "views.open",
        botModal({
          id: "bothelper-modal",
          title: "Start a help session",
          trigger_id: payload.trigger_id,
          blocks: [
            buildingBlocks.section({
              text: "Got a burning question? 🔥 Send it over and I'll jump in to assist!",
            }),
            buildingBlocks.input({
              id: "opinion",
              label: "Spill the beans! What's bothering you?",
              placeholder: "E.g., Who's the bug-busting champ around here?",
              initial_value: payload.text ?? "",
              hint: "Imagine you're asking your most knowledgeable colleague.",
            }),
            buildingBlocks.select({
              id: "crises_mode",
              label: "Just how spicy is your issue?",
              placeholder: "Gauge the drama level",
              options: [
                {
                  label: "Mild",
                  value: "A Jira ticket we'll silently sweep under the rug",
                },
                {
                  label: "Hot",
                  value: "A client who WRITES EVERYTHING IN CAPITAL LETTERS",
                },
                {
                  label: "Blazing",
                  value:
                    "Every tick of the clock nudges the company closer to a shutdown",
                },
              ],
            }),
          ],
        })
      );

      if (!response.ok) {
        console.log(response);
      }

      break;

    default:
      return {
        statusCode: 200,
        body: `The slash command ${payload.command} does not exists`,
      };
  }

  return {
    statusCode: 200,
    body: "",
  };
}

export const handler: Handler = async (event) => {
  // TODO validate the Slack request
  const validRequest = verifyRequestFromSlack(event);

  if (!validRequest) {
    console.error("invalid request!");

    return {
      statusCode: 400,
      body: "Invalid Request!",
    };
  }
  
  // TODO handle slash commands
  const body = parse(event.body ?? "") as SlackPayload;

  if (body.command) {
    return handleSlackSlashCommand(body as SlackSlashCommandPayload);
  }

  // TODO handle interactivity (e.g. context commands, modals)
  if(body.payload){
	console.log("Got body payload!", body.payload);
	const payload = JSON.parse(body.payload);
	return handleInterActivity(payload)
  }
  return {
    statusCode: 200,
    body: "TODO: This bot handle Slack commands and interactivity",
  };
};
