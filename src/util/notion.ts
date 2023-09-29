// TODO create Notion utilities
export async function notionApi(endpoint: string, body: {}) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${process.env.NOTION_SECRET}`,
      'Notion-Version': '2022-06-28',
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  }).catch((error) => console.error(error));

  if (!response || !response.ok) {
    console.error(response);
  }

  const data = await response?.json();

  return data;
}

export async function getToDoItemsFromNotion(): Promise<NewItem[]> {
    
  const notionData = await notionApi(
    `/databases/${process.env.NOTION_DATABASE_ID}/query`,
    {
      filter: {
        property: "Status",
        status: {
          equals: "new",
        },
      },
      page_size: 100,
    }
  );

  const openIssues = notionData.results.map((item: NotionItem)=>{
    return {
        opinion: item.properties.opinion.title[0].text.content,
        spiceLevel: item.properties.spiceLevel.select.name,
        status: item.properties.Status.status.name,
    }
  })

  return openIssues;
}


export async function saveItemToNotion(item: NewItem){

    const response = await notionApi('/pages',{
        parent: {
            database_id: process.env.NOTION_DATABASE_ID,

        },
        properties: {
            opinion: {
                title: [{text: {content: item.opinion}}],
                
            },
            spiceLevel: {
                select: {
                    name: item.spiceLevel
                }
            },
            submitter: {
                rich_text: [{text: {content: `@${item.submitter} on Slack`}}]
            }
        }
    })

    if(!response.ok){
        console.log(response)
    }
}