import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import 'highlight.js/styles/atom-one-dark.css';

export const CodeBlock = createReactBlockSpec(
  {
    type: 'codeBlock',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      language: {
        default: 'javascript',
      },
    },
    content: 'inline',
  },
  {
    render: (props) => {
      return (
        <pre className="refine-code-block" data-text-alignment={props.block.props.textAlignment}>
          <code 
            className={`language-${props.block.props.language}`} 
            ref={props.contentRef} 
          />
        </pre>
      );
    },
  }
);
