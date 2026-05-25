import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';

const headingPropSchema = {
  textAlignment: defaultProps.textAlignment,
  textColor: defaultProps.textColor,
};

export const Heading4Block = createReactBlockSpec(
  {
    type: 'heading4',
    propSchema: headingPropSchema,
    content: 'inline',
  },
  {
    render: (props) => <h4 className="refine-h4" ref={props.contentRef} data-text-alignment={props.block.props.textAlignment} />,
  }
);

export const Heading5Block = createReactBlockSpec(
  {
    type: 'heading5',
    propSchema: headingPropSchema,
    content: 'inline',
  },
  {
    render: (props) => <h5 className="refine-h5" ref={props.contentRef} data-text-alignment={props.block.props.textAlignment} />,
  }
);

export const Heading6Block = createReactBlockSpec(
  {
    type: 'heading6',
    propSchema: headingPropSchema,
    content: 'inline',
  },
  {
    render: (props) => <h6 className="refine-h6" ref={props.contentRef} data-text-alignment={props.block.props.textAlignment} />,
  }
);
