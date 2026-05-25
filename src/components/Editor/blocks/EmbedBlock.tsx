import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { useState } from 'react';

export const EmbedBlock = createReactBlockSpec(
  {
    type: 'embed',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      url: {
        default: '',
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const [inputUrl, setInputUrl] = useState(props.block.props.url);

      const handleEmbed = () => {
        let finalUrl = inputUrl;
        
        // Transform YouTube watch URLs to embed URLs
        const ytMatch = inputUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
        if (ytMatch && ytMatch[1]) {
          finalUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
        }
        
        props.editor.updateBlock(props.block, {
          type: 'embed',
          props: { url: finalUrl },
        });
      };

      if (!props.block.props.url) {
        return (
          <div className="refine-embed-placeholder" contentEditable={false}>
            <input
              type="text"
              placeholder="Paste a URL (YouTube, Figma, etc.) and press Enter..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEmbed();
              }}
            />
            <button onClick={handleEmbed}>Embed</button>
          </div>
        );
      }

      return (
        <div className="refine-embed-block" contentEditable={false}>
          <iframe
            src={props.block.props.url}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded content"
          ></iframe>
        </div>
      );
    },
  }
);
