import styled, {css} from "styled-components";
import Tag from "./Tag";
import {formatDistanceToNow} from "date-fns";

import {MdContentCopy, MdDelete, MdEdit} from "react-icons/md";
import useHover from "../hooks/useHover";
import {useRef} from "react";

const ICON_HEIGHT = 40;

const Card = styled.article`
  border-radius: ${props => props.theme.radius.medium};
  font-size: ${props => props.theme.fontSizes.medium}rem;
  background-color: ${props => props.theme.colors.grey};
  display: flex;
  overflow: hidden;
  min-height: 120px;
`

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const CardFlow = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
`

const CardHead = styled.div`
  display: flex;
`

const Picture = styled.img<{ isIcon?: boolean }>`
  margin-right: ${props => props.theme.spacing.medium};
  height: ${props => props.isIcon ? `${ICON_HEIGHT}px` : "100%"};
  display: inline-block;
  max-width: 100px;
`

const Title = styled.h3`
  font-size: ${props => props.theme.fontSizes.medium}em;
`

const Link = styled.a`
  font-size: ${props => props.theme.fontSizes.verySmall}em;
  color: ${props => props.theme.colors.whiteAlternative};
`

const Description = styled.p`
  font-size: ${props => props.theme.fontSizes.small}em;
  color: ${props => props.theme.colors.whiteAlternative};
  margin: ${props => props.theme.spacing.medium} 0;
`

const TagsContainer = styled.div`
  & > * {
    margin-right: ${props => props.theme.spacing.small};
    margin-top: ${props => props.theme.spacing.small};
  }
`

const DateTime = styled.time`
  font-size: ${props => props.theme.fontSizes.verySmall}em;
  color: ${props => props.theme.colors.whiteAlternative};
  margin-left: auto;
`
const CardInside = styled.div`
  padding: ${props => props.theme.spacing.medium};
  width: 100%;
  display: inline-flex;
  overflow-y: hidden;
  flex-grow: 1;
  height: 100%;
`

const CardMenu = styled.div<{ isShown: boolean }>`
  background-color: ${props => props.theme.colors.lightGrey};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.theme.spacing.medium} ${props => props.theme.spacing.small};

  & > button:nth-last-child(n+2) {
    margin-bottom: ${props => props.theme.spacing.medium};
  }

  & > button:last-child {
    margin-top: auto;
  }

  transition: width 0.1s ease-in-out, opacity 0.1s ease-in-out;

  ${props => {
    if (props.isShown) {
      return css`;
        width: 45px;
        opacity: 1;
      `
    }
    return css`
      opacity: 0;
      width: 0;`
  }}
`

const MenuButton = styled.button`
  border: none;
  width: 25px;
  height: 25px;
  background: none;
  cursor: pointer;

  & > svg {
    color: ${props => props.theme.colors.whiteAlternative};
    width: 100%;
    height: 100%;
    transition: color 0.1s;
  }

  &:hover {
    > svg {
      color: ${props => props.theme.colors.white};
    }
  }
`

type Props = {
    variant: "preview" | "icon",
    title: string,
    id: string,
    link: string,
    picturePath: string;
    description: string,
    tags: string[],
    datetime: Date
}

export default function BookmarkCard({variant, title, id, link, picturePath, description, tags, datetime}: Props) {
    const ref = useRef(null);
    const isHovered = useHover(ref);

    function handleCopyLinkButtonClick() {
        navigator.clipboard.writeText(link);
    }

    return <Card ref={ref}>
        <CardInside>
            {variant === "preview" && <Picture src={picturePath} alt="Preview or website icon picture"/>}
            <CardFlow>
                <CardHead>
                    {variant === "icon" && <Picture src={picturePath} alt="Preview or website icon picture" isIcon/>}
                    <TitleContainer>
                        <Title>{title}</Title>
                        <Link href={link}>{link}</Link>
                    </TitleContainer>
                    {!isHovered && <DateTime data-testid="datetime"
                                             dateTime={datetime.toISOString()}>{formatDistanceToNow(datetime, {addSuffix: true})}</DateTime>}
                </CardHead>
                <Description>{description}</Description>
                <TagsContainer>
                    {tags.map(tag => {
                        return <Tag size="little" key={tag}>{tag}</Tag>;
                    })}
                </TagsContainer>
            </CardFlow>
        </CardInside>
        <CardMenu data-testid="menu" isShown={isHovered}>
            <MenuButton aria-label="copy" onClick={handleCopyLinkButtonClick}>
                <MdContentCopy/>
            </MenuButton>
            <MenuButton aria-label="edit">
                <MdEdit/>
            </MenuButton>
            <MenuButton aria-label="delete">
                <MdDelete/>
            </MenuButton>
        </CardMenu>
    </Card>
}