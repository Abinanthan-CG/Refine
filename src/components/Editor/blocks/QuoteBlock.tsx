import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';

export const QuoteBlock = createReactBlockSpec(
  {
    type: 'quote',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
    },
    content: 'inline',
  },
  {
    render: (props) => {
      return (
        <div
          className="refine-quote-block"
          data-text-alignment={props.block.props.textAlignment}
          ref={props.contentRef}
        />
      );
    },
  }
);
